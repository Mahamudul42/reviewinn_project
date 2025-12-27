--
-- PostgreSQL database dump
--

\restrict YhSKJHPVPkfbBloszfBylJCgfoDZW9x0ucNTjwGQJDrHTbihvZ6KGKhGxU2J65A

-- Dumped from database version 17.6 (Debian 17.6-2.pgdg13+1)
-- Dumped by pg_dump version 17.6 (Ubuntu 17.6-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: comment_reaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.comment_reaction_type AS ENUM (
    'thumbs_up',
    'thumbs_down',
    'bomb',
    'love',
    'haha',
    'celebration',
    'sad',
    'eyes'
);


--
-- Name: connection_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.connection_status_enum AS ENUM (
    'PENDING',
    'ACCEPTED',
    'BLOCKED',
    'REJECTED'
);


--
-- Name: connection_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.connection_type_enum AS ENUM (
    'FOLLOW',
    'FRIEND'
);


--
-- Name: reaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reaction_type AS ENUM (
    'thumbs_up',
    'thumbs_down',
    'bomb',
    'love',
    'haha',
    'celebration',
    'sad',
    'eyes'
);


--
-- Name: userrole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.userrole AS ENUM (
    'USER',
    'MODERATOR',
    'ADMIN'
);


--
-- Name: get_count_consistency_report(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_count_consistency_report() RETURNS TABLE(review_id integer, stored_comment_count integer, actual_comment_count bigint, comment_count_diff integer, stored_view_count integer, actual_view_count bigint, view_count_diff integer, stored_reaction_count integer, actual_reaction_count bigint, reaction_count_diff integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rm.review_id,
        rm.comment_count as stored_comment_count,
        COALESCE(cc.actual_comments, 0) as actual_comment_count,
        rm.comment_count - COALESCE(cc.actual_comments, 0)::INTEGER as comment_count_diff,
        rm.view_count as stored_view_count,
        COALESCE(vc.actual_views, 0) as actual_view_count,
        rm.view_count - COALESCE(vc.actual_views, 0)::INTEGER as view_count_diff,
        rm.reaction_count as stored_reaction_count,
        COALESCE(rc.actual_reactions, 0) as actual_reaction_count,
        rm.reaction_count - COALESCE(rc.actual_reactions, 0)::INTEGER as reaction_count_diff
    FROM review_main rm
    LEFT JOIN (
        SELECT review_id, COUNT(*) as actual_comments
        FROM review_comments
        GROUP BY review_id
    ) cc ON rm.review_id = cc.review_id
    LEFT JOIN (
        SELECT review_id, COUNT(*) as actual_views
        FROM review_views
        WHERE (is_valid IS NULL OR is_valid = true)
        AND (expires_at IS NULL OR expires_at > NOW())
        GROUP BY review_id
    ) vc ON rm.review_id = vc.review_id
    LEFT JOIN (
        SELECT review_id, COUNT(*) as actual_reactions
        FROM review_reactions
        GROUP BY review_id
    ) rc ON rm.review_id = rc.review_id
    WHERE rm.comment_count != COALESCE(cc.actual_comments, 0)
       OR rm.view_count != COALESCE(vc.actual_views, 0)
       OR rm.reaction_count != COALESCE(rc.actual_reactions, 0)
    ORDER BY rm.review_id;
END;
$$;


--
-- Name: get_reaction_summary_enterprise(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_reaction_summary_enterprise(p_review_id integer, p_user_id integer DEFAULT NULL::integer) RETURNS TABLE(reaction_type character varying, reaction_count bigint, user_reaction character varying, total_reactions bigint)
    LANGUAGE sql STABLE
    AS $$
    WITH reaction_counts AS (
        SELECT 
            rr.reaction_type::VARCHAR(50) as reaction_type,
            COUNT(*) as reaction_count
        FROM review_reactions rr
        WHERE rr.review_id = p_review_id
        GROUP BY rr.reaction_type
    ),
    user_reaction_query AS (
        SELECT rr.reaction_type::VARCHAR(50) as user_reaction_type
        FROM review_reactions rr
        WHERE rr.review_id = p_review_id 
          AND rr.user_id = p_user_id
        LIMIT 1
    ),
    total_count AS (
        SELECT COUNT(*) as total
        FROM review_reactions rr
        WHERE rr.review_id = p_review_id
    )
    SELECT 
        rc.reaction_type,
        rc.reaction_count,
        COALESCE(ur.user_reaction_type, NULL::VARCHAR(50)) as user_reaction,
        tc.total as total_reactions
    FROM reaction_counts rc
    CROSS JOIN total_count tc
    LEFT JOIN user_reaction_query ur ON TRUE
    
    UNION ALL
    
    -- Handle case where user has reaction but it's not in the main counts
    SELECT 
        NULL::VARCHAR(50),
        0::BIGINT,
        ur.user_reaction_type,
        tc.total
    FROM user_reaction_query ur
    CROSS JOIN total_count tc
    WHERE NOT EXISTS (SELECT 1 FROM reaction_counts);
$$;


--
-- Name: get_user_reaction_optimized(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_reaction_optimized(p_user_id integer, p_review_id integer) RETURNS character varying
    LANGUAGE sql STABLE
    AS $$
    SELECT reaction_type::text
    FROM review_reactions
    WHERE user_id = p_user_id AND review_id = p_review_id;
$$;


--
-- Name: get_user_reactions_bulk(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_reactions_bulk(p_user_id integer, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(review_id integer, reaction_type character varying, reaction_id integer, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE sql STABLE
    AS $$
    SELECT 
        rr.review_id,
        rr.reaction_type::VARCHAR(50),
        rr.reaction_id,
        rr.created_at,
        rr.updated_at
    FROM review_reactions rr
    WHERE rr.user_id = p_user_id
    ORDER BY rr.created_at DESC
    LIMIT p_limit OFFSET p_offset;
$$;


--
-- Name: recalculate_all_counts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recalculate_all_counts() RETURNS TABLE(reviews_updated integer, comments_updated integer, reactions_updated integer, views_updated integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    review_count INTEGER;
    comment_count INTEGER;
    reaction_count INTEGER;
    view_count INTEGER;
    review_record RECORD;
BEGIN
    -- Fix comment counts
    UPDATE review_main SET comment_count = (
        SELECT COUNT(*) 
        FROM review_comments 
        WHERE review_comments.review_id = review_main.review_id
    );
    GET DIAGNOSTICS review_count = ROW_COUNT;
    
    -- Fix comment reaction counts
    UPDATE review_comments SET reaction_count = COALESCE((
        SELECT COUNT(*) 
        FROM review_comment_reactions 
        WHERE review_comment_reactions.comment_id = review_comments.comment_id
    ), 0);
    GET DIAGNOSTICS comment_count = ROW_COUNT;
    
    -- Fix review reaction counts
    FOR review_record IN SELECT review_id FROM review_main
    LOOP
        PERFORM update_single_review_reaction_count(review_record.review_id);
    END LOOP;
    GET DIAGNOSTICS reaction_count = ROW_COUNT;
    
    -- Fix view counts
    UPDATE review_main SET view_count = COALESCE((
        SELECT COUNT(*) 
        FROM review_views 
        WHERE review_views.review_id = review_main.review_id
        AND (is_valid IS NULL OR is_valid = true)
        AND (expires_at IS NULL OR expires_at > NOW())
    ), 0);
    GET DIAGNOSTICS view_count = ROW_COUNT;
    
    RETURN QUERY SELECT review_count, comment_count, reaction_count, view_count;
END;
$$;


--
-- Name: remove_user_reaction_optimized(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.remove_user_reaction_optimized(p_user_id integer, p_review_id integer) RETURNS TABLE(deleted boolean, reaction_id integer, reaction_type character varying)
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_reaction RECORD;
BEGIN
    DELETE FROM review_reactions 
    WHERE user_id = p_user_id AND review_id = p_review_id
    RETURNING review_reactions.reaction_id, review_reactions.reaction_type::VARCHAR(50) INTO deleted_reaction;
    
    IF FOUND THEN
        RETURN QUERY SELECT TRUE, deleted_reaction.reaction_id, deleted_reaction.reaction_type;
    ELSE
        RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::VARCHAR(50);
    END IF;
END;
$$;


--
-- Name: review_reactions_performance_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.review_reactions_performance_stats() RETURNS TABLE(total_reactions bigint, unique_users bigint, unique_reviews bigint, avg_reactions_per_review numeric, avg_reactions_per_user numeric, top_reaction_type character varying, top_reaction_count bigint, index_usage_stats json)
    LANGUAGE sql STABLE
    AS $$
    WITH base_stats AS (
        SELECT 
            COUNT(*) as total_reactions,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(DISTINCT review_id) as unique_reviews
        FROM review_reactions
    ),
    reaction_type_stats AS (
        SELECT 
            reaction_type::VARCHAR(50) as top_reaction_type,
            COUNT(*) as top_reaction_count
        FROM review_reactions
        GROUP BY reaction_type
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ),
    index_stats AS (
        SELECT json_agg(
            json_build_object(
                'index_name', indexname,
                'size', pg_size_pretty(pg_total_relation_size(indexname::regclass))
            )
        ) as index_usage_stats
        FROM pg_indexes 
        WHERE tablename = 'review_reactions'
    )
    SELECT 
        bs.total_reactions,
        bs.unique_users,
        bs.unique_reviews,
        ROUND(bs.total_reactions::DECIMAL / bs.unique_reviews, 2) as avg_reactions_per_review,
        ROUND(bs.total_reactions::DECIMAL / bs.unique_users, 2) as avg_reactions_per_user,
        rts.top_reaction_type,
        rts.top_reaction_count,
        is_table.index_usage_stats
    FROM base_stats bs
    CROSS JOIN reaction_type_stats rts  
    CROSS JOIN index_stats is_table;
$$;


--
-- Name: sync_supertokens_user(character varying, character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_supertokens_user(p_supertokens_user_id character varying, p_email character varying, p_first_name character varying DEFAULT NULL::character varying, p_last_name character varying DEFAULT NULL::character varying, p_display_name character varying DEFAULT NULL::character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_user_id INTEGER;
    v_username VARCHAR(255);
    v_computed_display_name VARCHAR(255);
BEGIN
    -- Generate username from email
    v_username := LOWER(SPLIT_PART(p_email, '@', 1));
    
    -- Generate display name
    IF p_display_name IS NOT NULL THEN
        v_computed_display_name := p_display_name;
    ELSIF p_first_name IS NOT NULL AND p_last_name IS NOT NULL THEN
        v_computed_display_name := TRIM(p_first_name || ' ' || p_last_name);
    ELSE
        v_computed_display_name := v_username;
    END IF;
    
    -- Check if user already exists with this SuperTokens ID
    SELECT user_id INTO v_user_id 
    FROM core_users 
    WHERE supertokens_user_id = p_supertokens_user_id;
    
    IF FOUND THEN
        -- Update existing user
        UPDATE core_users SET
            email = p_email,
            first_name = COALESCE(p_first_name, first_name),
            last_name = COALESCE(p_last_name, last_name),
            display_name = COALESCE(v_computed_display_name, display_name),
            updated_at = NOW()
        WHERE user_id = v_user_id;
        
        RAISE NOTICE 'Updated existing user % with SuperTokens ID %', v_user_id, p_supertokens_user_id;
        RETURN v_user_id;
    END IF;
    
    -- Check if user exists with this email but no SuperTokens ID
    SELECT user_id INTO v_user_id 
    FROM core_users 
    WHERE email = p_email AND supertokens_user_id IS NULL;
    
    IF FOUND THEN
        -- Link existing user to SuperTokens
        UPDATE core_users SET
            supertokens_user_id = p_supertokens_user_id,
            first_name = COALESCE(p_first_name, first_name),
            last_name = COALESCE(p_last_name, last_name),
            display_name = COALESCE(v_computed_display_name, display_name),
            is_verified = true, -- SuperTokens handles verification
            updated_at = NOW()
        WHERE user_id = v_user_id;
        
        RAISE NOTICE 'Linked existing user % to SuperTokens ID %', v_user_id, p_supertokens_user_id;
        RETURN v_user_id;
    END IF;
    
    -- Make username unique if it already exists
    WHILE EXISTS(SELECT 1 FROM core_users WHERE username = v_username) LOOP
        v_username := v_username || '_' || floor(random() * 1000)::text;
    END LOOP;
    
    -- Create new user
    INSERT INTO core_users (
        supertokens_user_id,
        username,
        email,
        hashed_password, -- Will be managed by SuperTokens
        first_name,
        last_name,
        display_name,
        is_verified, -- SuperTokens handles verification
        is_active,
        created_at,
        updated_at
    ) VALUES (
        p_supertokens_user_id,
        v_username,
        p_email,
        '', -- Empty since SuperTokens manages passwords
        p_first_name,
        p_last_name,
        v_computed_display_name,
        true, -- SuperTokens users are verified
        true,
        NOW(),
        NOW()
    ) RETURNING user_id INTO v_user_id;
    
    RAISE NOTICE 'Created new user % for SuperTokens ID %', v_user_id, p_supertokens_user_id;
    RETURN v_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error syncing SuperTokens user: %', SQLERRM;
END;
$$;


--
-- Name: FUNCTION sync_supertokens_user(p_supertokens_user_id character varying, p_email character varying, p_first_name character varying, p_last_name character varying, p_display_name character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.sync_supertokens_user(p_supertokens_user_id character varying, p_email character varying, p_first_name character varying, p_last_name character varying, p_display_name character varying) IS 'Syncs SuperTokens user data with ReviewInn user records';


--
-- Name: update_comment_reaction_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_comment_reaction_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        UPDATE review_comments 
        SET reaction_count = (
            SELECT COUNT(*) 
            FROM review_comment_reactions 
            WHERE comment_id = NEW.comment_id
        )
        WHERE comment_id = NEW.comment_id;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE review_comments 
        SET reaction_count = (
            SELECT COUNT(*) 
            FROM review_comment_reactions 
            WHERE comment_id = OLD.comment_id
        )
        WHERE comment_id = OLD.comment_id;
        
        RETURN OLD;
    END IF;
    
    -- Handle UPDATE (if comment_id changes)
    IF TG_OP = 'UPDATE' AND OLD.comment_id != NEW.comment_id THEN
        -- Update old comment count
        UPDATE review_comments 
        SET reaction_count = (
            SELECT COUNT(*) 
            FROM review_comment_reactions 
            WHERE comment_id = OLD.comment_id
        )
        WHERE comment_id = OLD.comment_id;
        
        -- Update new comment count
        UPDATE review_comments 
        SET reaction_count = (
            SELECT COUNT(*) 
            FROM review_comment_reactions 
            WHERE comment_id = NEW.comment_id
        )
        WHERE comment_id = NEW.comment_id;
        
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_core_users_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_core_users_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_group_review_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_group_review_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.group_id IS NOT NULL THEN
        UPDATE review_groups 
        SET review_count = COALESCE(review_count, 0) + 1,
            updated_at = NOW()
        WHERE group_id = NEW.group_id;
        
    ELSIF TG_OP = 'UPDATE' AND NEW.group_id IS NOT NULL AND OLD.group_id IS NULL THEN
        -- Review was added to a group
        UPDATE review_groups 
        SET review_count = COALESCE(review_count, 0) + 1,
            updated_at = NOW()
        WHERE group_id = NEW.group_id;
        
    ELSIF TG_OP = 'UPDATE' AND NEW.group_id IS NULL AND OLD.group_id IS NOT NULL THEN
        -- Review was removed from a group
        UPDATE review_groups 
        SET review_count = GREATEST(COALESCE(review_count, 0) - 1, 0),
            updated_at = NOW()
        WHERE group_id = OLD.group_id;
        
    ELSIF TG_OP = 'UPDATE' AND NEW.group_id IS NOT NULL AND OLD.group_id IS NOT NULL AND NEW.group_id != OLD.group_id THEN
        -- Review moved from one group to another
        UPDATE review_groups 
        SET review_count = GREATEST(COALESCE(review_count, 0) - 1, 0),
            updated_at = NOW()
        WHERE group_id = OLD.group_id;
        
        UPDATE review_groups 
        SET review_count = COALESCE(review_count, 0) + 1,
            updated_at = NOW()
        WHERE group_id = NEW.group_id;
        
    ELSIF TG_OP = 'DELETE' AND OLD.group_id IS NOT NULL THEN
        UPDATE review_groups 
        SET review_count = GREATEST(COALESCE(review_count, 0) - 1, 0),
            updated_at = NOW()
        WHERE group_id = OLD.group_id;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: update_review_comment_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_review_comment_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        UPDATE review_main 
        SET comment_count = (
            SELECT COUNT(*) 
            FROM review_comments 
            WHERE review_id = NEW.review_id
        )
        WHERE review_id = NEW.review_id;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE review_main 
        SET comment_count = (
            SELECT COUNT(*) 
            FROM review_comments 
            WHERE review_id = OLD.review_id
        )
        WHERE review_id = OLD.review_id;
        
        RETURN OLD;
    END IF;
    
    -- Handle UPDATE (if review_id changes)
    IF TG_OP = 'UPDATE' AND OLD.review_id != NEW.review_id THEN
        -- Update old review count
        UPDATE review_main 
        SET comment_count = (
            SELECT COUNT(*) 
            FROM review_comments 
            WHERE review_id = OLD.review_id
        )
        WHERE review_id = OLD.review_id;
        
        -- Update new review count
        UPDATE review_main 
        SET comment_count = (
            SELECT COUNT(*) 
            FROM review_comments 
            WHERE review_id = NEW.review_id
        )
        WHERE review_id = NEW.review_id;
        
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_review_reaction_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_review_reaction_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    target_review_id INTEGER;
    reaction_stats RECORD;
    total_reactions INTEGER := 0;
    top_reactions_json JSON := '{}';
BEGIN
    -- Determine which review_id to update
    IF TG_OP = 'DELETE' THEN
        target_review_id := OLD.review_id;
    ELSE
        target_review_id := NEW.review_id;
    END IF;
    
    -- Handle case where review_id changes (UPDATE)
    IF TG_OP = 'UPDATE' AND OLD.review_id != NEW.review_id THEN
        -- Update old review
        PERFORM update_single_review_reaction_count(OLD.review_id);
        -- Continue with new review below
    END IF;
    
    -- Update the target review
    PERFORM update_single_review_reaction_count(target_review_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_review_view_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_review_view_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    target_review_id INTEGER;
    valid_view_count INTEGER;
BEGIN
    -- Determine which review_id to update
    IF TG_OP = 'DELETE' THEN
        target_review_id := OLD.review_id;
    ELSE
        target_review_id := NEW.review_id;
    END IF;
    
    -- Handle case where review_id changes (UPDATE)
    IF TG_OP = 'UPDATE' AND OLD.review_id != NEW.review_id THEN
        -- Update old review count
        SELECT COUNT(*) INTO valid_view_count
        FROM review_views 
        WHERE review_id = OLD.review_id 
        AND (is_valid IS NULL OR is_valid = true)
        AND (expires_at IS NULL OR expires_at > NOW());
        
        UPDATE review_main 
        SET view_count = valid_view_count
        WHERE review_id = OLD.review_id;
    END IF;
    
    -- Count valid views for the target review
    SELECT COUNT(*) INTO valid_view_count
    FROM review_views 
    WHERE review_id = target_review_id 
    AND (is_valid IS NULL OR is_valid = true)
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Update the review with the accurate count
    UPDATE review_main 
    SET view_count = valid_view_count
    WHERE review_id = target_review_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_single_review_reaction_count(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_single_review_reaction_count(target_review_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    reaction_stats RECORD;
    total_reactions INTEGER := 0;
    reactions_obj JSONB := '{}';
BEGIN
    -- Get reaction counts grouped by type
    FOR reaction_stats IN
        SELECT reaction_type, COUNT(*) as count
        FROM review_reactions 
        WHERE review_id = target_review_id
        GROUP BY reaction_type
        ORDER BY COUNT(*) DESC
        LIMIT 10
    LOOP
        -- Build the reactions object using JSONB
        reactions_obj := reactions_obj || jsonb_build_object(reaction_stats.reaction_type::text, reaction_stats.count);
        total_reactions := total_reactions + reaction_stats.count;
    END LOOP;
    
    -- Update the review with new counts (cast JSONB to JSON)
    UPDATE review_main 
    SET 
        reaction_count = total_reactions,
        top_reactions = reactions_obj::json,
        updated_at = NOW()
    WHERE review_id = target_review_id;
    
END;
$$;


--
-- Name: update_user_interactions_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_interactions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: upsert_user_reaction_optimized(integer, integer, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_user_reaction_optimized(p_user_id integer, p_review_id integer, p_reaction_type character varying) RETURNS TABLE(action character varying, reaction_id integer, user_id integer, review_id integer, reaction_type character varying, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Use PostgreSQL's native UPSERT (ON CONFLICT) for maximum performance
    INSERT INTO review_reactions (user_id, review_id, reaction_type)
    VALUES (p_user_id, p_review_id, p_reaction_type::reaction_type)
    ON CONFLICT (user_id, review_id) 
    DO UPDATE SET 
        reaction_type = EXCLUDED.reaction_type,
        updated_at = NOW()
    RETURNING 
        CASE 
            WHEN xmax = 0 THEN 'INSERT'::VARCHAR(10)
            ELSE 'UPDATE'::VARCHAR(10)
        END as action,
        review_reactions.reaction_id,
        review_reactions.user_id,
        review_reactions.review_id,
        review_reactions.reaction_type::VARCHAR(50),
        review_reactions.created_at,
        review_reactions.updated_at
    INTO action, reaction_id, user_id, review_id, reaction_type, created_at, updated_at;
    
    RETURN NEXT;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: badge_awards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badge_awards (
    award_id bigint NOT NULL,
    user_id bigint,
    badge_definition_id bigint,
    awarded_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: badge_awards_award_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.badge_awards_award_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: badge_awards_award_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.badge_awards_award_id_seq OWNED BY public.badge_awards.award_id;


--
-- Name: badge_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badge_definitions (
    badge_definition_id bigint NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    criteria json NOT NULL,
    image_url character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: badge_definitions_badge_definition_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.badge_definitions_badge_definition_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: badge_definitions_badge_definition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.badge_definitions_badge_definition_id_seq OWNED BY public.badge_definitions.badge_definition_id;


--
-- Name: badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badges (
    badge_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(50)
);


--
-- Name: badges_badge_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.badges_badge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: badges_badge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.badges_badge_id_seq OWNED BY public.badges.badge_id;


--
-- Name: category_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_questions (
    id bigint NOT NULL,
    category_path character varying(255) NOT NULL,
    category_name character varying(200) NOT NULL,
    category_level integer NOT NULL,
    is_root_category boolean NOT NULL,
    questions json NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by bigint,
    is_active boolean,
    usage_count integer,
    last_used_at timestamp with time zone
);


--
-- Name: category_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.category_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: category_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.category_questions_id_seq OWNED BY public.category_questions.id;


--
-- Name: core_entities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.core_entities (
    entity_id integer NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    avatar character varying(255),
    website character varying(500),
    images jsonb,
    root_category jsonb,
    final_category jsonb,
    is_verified boolean,
    is_active boolean,
    is_claimed boolean,
    claimed_by integer,
    claimed_at timestamp with time zone,
    metadata jsonb,
    roles jsonb,
    related_entities jsonb,
    business_info jsonb,
    claim_data jsonb,
    view_analytics jsonb,
    average_rating double precision,
    review_count integer,
    view_count integer NOT NULL,
    reaction_count integer NOT NULL,
    comment_count integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: core_entities_entity_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.core_entities_entity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: core_entities_entity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.core_entities_entity_id_seq OWNED BY public.core_entities.entity_id;


--
-- Name: core_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.core_notifications (
    notification_id integer NOT NULL,
    user_id integer,
    actor_id integer,
    type character varying(50) NOT NULL,
    title character varying(200),
    content text,
    is_read boolean NOT NULL,
    priority character varying(20) NOT NULL,
    delivery_status character varying(20) NOT NULL,
    entity_type character varying(50),
    entity_id integer,
    notification_data jsonb NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: core_notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.core_notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: core_notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.core_notifications_notification_id_seq OWNED BY public.core_notifications.notification_id;


--
-- Name: core_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.core_users (
    user_id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    display_name character varying(255),
    avatar character varying(255),
    bio text,
    country character varying(100),
    city character varying(100),
    is_verified boolean,
    is_active boolean,
    is_premium boolean,
    follower_count integer,
    following_count integer,
    review_count integer,
    friend_count integer,
    level integer,
    points integer,
    last_gamification_sync timestamp with time zone,
    gamification_sync_version integer,
    gamification_sync_status character varying(50),
    last_active_at timestamp with time zone,
    last_login_at timestamp with time zone,
    role public.userrole,
    permissions json,
    failed_login_attempts integer,
    account_locked_until timestamp with time zone,
    password_changed_at timestamp with time zone,
    email_verification_token character varying(255),
    email_verification_expires timestamp with time zone,
    email_verified_at timestamp with time zone,
    password_reset_token character varying(255),
    password_reset_expires timestamp with time zone,
    active_sessions json,
    trusted_devices json,
    security_events json,
    two_factor_enabled boolean,
    two_factor_secret character varying(255),
    recovery_codes json,
    profile_data json,
    preferences json,
    verification_data json,
    favorite_entities json,
    favorite_reviews json,
    favorite_comments json,
    favorite_users json,
    favorite_categories json,
    view_tracking json,
    saved_reviews json,
    followed_entities json,
    notification_preferences json,
    review_interests json,
    blocked_users json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: core_users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.core_users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: core_users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.core_users_user_id_seq OWNED BY public.core_users.user_id;


--
-- Name: daily_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_tasks (
    task_id bigint NOT NULL,
    user_id bigint,
    label character varying(100) NOT NULL,
    complete boolean NOT NULL,
    task_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: daily_tasks_task_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_tasks_task_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_tasks_task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_tasks_task_id_seq OWNED BY public.daily_tasks.task_id;


--
-- Name: entity_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_analytics (
    entity_id bigint NOT NULL,
    total_views integer,
    unique_visitors integer,
    average_time_on_page integer,
    bounce_rate numeric(5,2),
    last_updated timestamp with time zone DEFAULT now()
);


--
-- Name: entity_comparisons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_comparisons (
    comparison_id bigint NOT NULL,
    user_id bigint,
    entity_ids json NOT NULL,
    comparison_data json NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: entity_comparisons_comparison_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entity_comparisons_comparison_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entity_comparisons_comparison_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entity_comparisons_comparison_id_seq OWNED BY public.entity_comparisons.comparison_id;


--
-- Name: entity_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_metadata (
    metadata_id bigint NOT NULL,
    entity_id bigint,
    field_name character varying NOT NULL,
    field_type character varying,
    options json,
    is_required boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: entity_metadata_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entity_metadata_metadata_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entity_metadata_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entity_metadata_metadata_id_seq OWNED BY public.entity_metadata.metadata_id;


--
-- Name: entity_relations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_relations (
    entity_id integer NOT NULL,
    related_entity_id integer NOT NULL
);


--
-- Name: entity_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_roles (
    role_id bigint NOT NULL,
    entity_id bigint,
    title character varying NOT NULL,
    organization character varying,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    is_current boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: entity_roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entity_roles_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entity_roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entity_roles_role_id_seq OWNED BY public.entity_roles.role_id;


--
-- Name: entity_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_views (
    view_id bigint NOT NULL,
    entity_id integer NOT NULL,
    user_id integer,
    ip_address character varying(45),
    user_agent character varying(500),
    session_id character varying(100),
    viewed_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_valid boolean,
    is_unique_user boolean,
    is_unique_session boolean
);


--
-- Name: entity_views_view_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entity_views_view_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entity_views_view_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entity_views_view_id_seq OWNED BY public.entity_views.view_id;


--
-- Name: followers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.followers (
    user_id integer NOT NULL,
    follower_user_id integer NOT NULL
);


--
-- Name: group_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_categories (
    category_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(100),
    color_code character varying(7),
    parent_category_id integer,
    sort_order integer,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: group_categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_categories_category_id_seq OWNED BY public.group_categories.category_id;


--
-- Name: group_category_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_category_mappings (
    group_id integer NOT NULL,
    category_id integer NOT NULL
);


--
-- Name: group_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_invitations (
    invitation_id integer NOT NULL,
    group_id integer NOT NULL,
    inviter_id integer NOT NULL,
    invitee_id integer NOT NULL,
    invitation_message text,
    suggested_role character varying(30),
    status character varying(20),
    response_message text,
    created_at timestamp with time zone DEFAULT now(),
    responded_at timestamp with time zone,
    expires_at timestamp with time zone
);


--
-- Name: group_invitations_invitation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_invitations_invitation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_invitations_invitation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_invitations_invitation_id_seq OWNED BY public.group_invitations.invitation_id;


--
-- Name: group_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_memberships (
    membership_id integer NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(30),
    membership_status character varying(20),
    can_post_reviews boolean,
    can_moderate_content boolean,
    can_invite_members boolean,
    can_manage_group boolean,
    reviews_count integer,
    last_activity_at timestamp with time zone,
    contribution_score double precision,
    joined_at timestamp with time zone DEFAULT now(),
    invited_by integer,
    join_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: group_memberships_membership_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_memberships_membership_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_memberships_membership_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_memberships_membership_id_seq OWNED BY public.group_memberships.membership_id;


--
-- Name: msg_conversation_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.msg_conversation_participants (
    participant_id integer NOT NULL,
    conversation_id integer,
    user_id integer,
    role character varying(20),
    joined_at timestamp with time zone DEFAULT now(),
    left_at timestamp with time zone,
    notification_preferences jsonb,
    last_read_at timestamp with time zone DEFAULT now(),
    unread_count integer
);


--
-- Name: msg_conversation_participants_participant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.msg_conversation_participants_participant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: msg_conversation_participants_participant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.msg_conversation_participants_participant_id_seq OWNED BY public.msg_conversation_participants.participant_id;


--
-- Name: msg_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.msg_conversations (
    conversation_id integer NOT NULL,
    conversation_type character varying(20),
    title character varying(200),
    is_private boolean,
    max_participants integer,
    conversation_metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: msg_conversations_conversation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.msg_conversations_conversation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: msg_conversations_conversation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.msg_conversations_conversation_id_seq OWNED BY public.msg_conversations.conversation_id;


--
-- Name: msg_message_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.msg_message_attachments (
    attachment_id integer NOT NULL,
    message_id integer,
    file_name character varying(255),
    file_size integer,
    file_type character varying(100),
    file_url character varying(500),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: msg_message_attachments_attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.msg_message_attachments_attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: msg_message_attachments_attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.msg_message_attachments_attachment_id_seq OWNED BY public.msg_message_attachments.attachment_id;


--
-- Name: msg_message_mentions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.msg_message_mentions (
    mention_id integer NOT NULL,
    message_id integer NOT NULL,
    mentioned_user_id integer NOT NULL,
    mention_type character varying(20),
    start_position integer,
    end_position integer,
    mention_text character varying(100),
    is_acknowledged boolean,
    acknowledged_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: msg_message_mentions_mention_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.msg_message_mentions_mention_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: msg_message_mentions_mention_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.msg_message_mentions_mention_id_seq OWNED BY public.msg_message_mentions.mention_id;


--
-- Name: msg_message_pins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.msg_message_pins (
    pin_id integer NOT NULL,
    conversation_id integer NOT NULL,
    message_id integer NOT NULL,
    pinned_by_user_id integer NOT NULL,
    pin_reason character varying(255),
    is_active boolean,
    pinned_at timestamp with time zone DEFAULT now(),
    unpinned_at timestamp with time zone
);


--
-- Name: msg_message_pins_pin_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.msg_message_pins_pin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: msg_message_pins_pin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.msg_message_pins_pin_id_seq OWNED BY public.msg_message_pins.pin_id;


--
-- Name: msg_message_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.msg_message_reactions (
    reaction_id integer NOT NULL,
    message_id integer,
    user_id integer,
    reaction_type character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: msg_message_reactions_reaction_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.msg_message_reactions_reaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: msg_message_reactions_reaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.msg_message_reactions_reaction_id_seq OWNED BY public.msg_message_reactions.reaction_id;


--
-- Name: msg_message_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.msg_message_status (
    status_id integer NOT NULL,
    message_id integer NOT NULL,
    user_id integer NOT NULL,
    status character varying(20),
    delivered_at timestamp with time zone,
    read_at timestamp with time zone,
    failed_reason character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: msg_message_status_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.msg_message_status_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: msg_message_status_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.msg_message_status_status_id_seq OWNED BY public.msg_message_status.status_id;


--
-- Name: msg_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.msg_messages (
    message_id integer NOT NULL,
    conversation_id integer,
    sender_id integer,
    reply_to_message_id integer,
    content text NOT NULL,
    message_type character varying(20),
    is_edited boolean,
    is_deleted boolean,
    message_metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: msg_messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.msg_messages_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: msg_messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.msg_messages_message_id_seq OWNED BY public.msg_messages.message_id;


--
-- Name: msg_threads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.msg_threads (
    thread_id integer NOT NULL,
    conversation_id integer NOT NULL,
    parent_message_id integer NOT NULL,
    thread_title character varying(255),
    reply_count integer,
    participant_count integer,
    last_reply_at timestamp with time zone,
    last_reply_user_id integer,
    is_archived boolean,
    thread_metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: msg_threads_thread_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.msg_threads_thread_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: msg_threads_thread_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.msg_threads_thread_id_seq OWNED BY public.msg_threads.thread_id;


--
-- Name: msg_typing_indicators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.msg_typing_indicators (
    typing_id integer NOT NULL,
    conversation_id integer NOT NULL,
    user_id integer NOT NULL,
    is_typing boolean,
    started_at timestamp with time zone DEFAULT now(),
    last_activity timestamp with time zone DEFAULT now()
);


--
-- Name: msg_typing_indicators_typing_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.msg_typing_indicators_typing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: msg_typing_indicators_typing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.msg_typing_indicators_typing_id_seq OWNED BY public.msg_typing_indicators.typing_id;


--
-- Name: msg_user_presence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.msg_user_presence (
    presence_id integer NOT NULL,
    user_id integer NOT NULL,
    status character varying(20),
    last_seen timestamp with time zone DEFAULT now(),
    is_online boolean,
    show_last_seen boolean,
    show_online_status boolean,
    device_info jsonb,
    session_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: msg_user_presence_presence_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.msg_user_presence_presence_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: msg_user_presence_presence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.msg_user_presence_presence_id_seq OWNED BY public.msg_user_presence.presence_id;


--
-- Name: review_comment_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_comment_reactions (
    reaction_id integer NOT NULL,
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    reaction_type public.comment_reaction_type NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: review_comment_reactions_reaction_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_comment_reactions_reaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_comment_reactions_reaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_comment_reactions_reaction_id_seq OWNED BY public.review_comment_reactions.reaction_id;


--
-- Name: review_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_comments (
    comment_id integer NOT NULL,
    review_id integer,
    user_id integer,
    content text NOT NULL,
    is_anonymous boolean,
    is_verified boolean,
    reaction_count integer,
    helpful_votes integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: review_comments_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_comments_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_comments_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_comments_comment_id_seq OWNED BY public.review_comments.comment_id;


--
-- Name: review_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_groups (
    group_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    group_type character varying(50),
    visibility character varying(20),
    avatar_url character varying(500),
    cover_image_url character varying(500),
    allow_public_reviews boolean,
    require_approval_for_reviews boolean,
    max_members integer,
    created_by integer,
    group_metadata jsonb,
    rules_and_guidelines text,
    external_links jsonb,
    member_count integer,
    review_count integer,
    active_members_count integer,
    is_active boolean,
    is_verified boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: review_groups_group_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_groups_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_groups_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_groups_group_id_seq OWNED BY public.review_groups.group_id;


--
-- Name: review_main; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_main (
    review_id integer NOT NULL,
    user_id integer NOT NULL,
    entity_id integer NOT NULL,
    role_id integer,
    title character varying(200),
    content text NOT NULL,
    overall_rating double precision NOT NULL,
    is_anonymous boolean,
    is_verified boolean,
    view_count integer NOT NULL,
    reaction_count integer NOT NULL,
    comment_count integer NOT NULL,
    ratings json,
    pros json,
    cons json,
    images json,
    top_reactions json NOT NULL,
    entity_summary json,
    user_summary json,
    reports_summary json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    group_id integer,
    review_scope character varying(20) DEFAULT 'public'::character varying
);


--
-- Name: COLUMN review_main.group_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.review_main.group_id IS 'If set, this review is posted in a specific group';


--
-- Name: COLUMN review_main.review_scope; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.review_main.review_scope IS 'Visibility scope: public (visible everywhere), group_only (only in group), mixed (both)';


--
-- Name: review_main_review_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_main_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_main_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_main_review_id_seq OWNED BY public.review_main.review_id;


--
-- Name: review_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_reactions (
    reaction_id integer NOT NULL,
    review_id integer NOT NULL,
    user_id integer NOT NULL,
    reaction_type public.reaction_type NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: review_reaction_analytics_enterprise; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.review_reaction_analytics_enterprise AS
 SELECT date_trunc('day'::text, created_at) AS reaction_date,
    (reaction_type)::character varying(50) AS reaction_type,
    count(*) AS daily_count,
    count(DISTINCT user_id) AS unique_users,
    count(DISTINCT review_id) AS unique_reviews,
    round(((count(*))::numeric / (count(DISTINCT review_id))::numeric), 2) AS avg_reactions_per_review
   FROM public.review_reactions
  WHERE (created_at >= (now() - '30 days'::interval))
  GROUP BY (date_trunc('day'::text, created_at)), reaction_type
  ORDER BY (date_trunc('day'::text, created_at)) DESC, (count(*)) DESC;


--
-- Name: review_reactions_reaction_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_reactions_reaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_reactions_reaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_reactions_reaction_id_seq OWNED BY public.review_reactions.reaction_id;


--
-- Name: review_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_templates (
    template_id bigint NOT NULL,
    name character varying(100) NOT NULL,
    unified_category_id bigint,
    template_data json NOT NULL,
    is_public boolean,
    created_by bigint,
    usage_count integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: review_templates_template_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_templates_template_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_templates_template_id_seq OWNED BY public.review_templates.template_id;


--
-- Name: review_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_versions (
    version_id bigint NOT NULL,
    review_id bigint,
    user_id bigint,
    rating integer,
    comment character varying,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: review_versions_version_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_versions_version_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_versions_version_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_versions_version_id_seq OWNED BY public.review_versions.version_id;


--
-- Name: review_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_views (
    view_id bigint NOT NULL,
    review_id integer NOT NULL,
    user_id integer,
    ip_address character varying(45),
    user_agent character varying(500),
    session_id character varying(100),
    viewed_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_valid boolean,
    is_unique_user boolean,
    is_unique_session boolean
);


--
-- Name: review_views_view_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_views_view_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_views_view_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_views_view_id_seq OWNED BY public.review_views.view_id;


--
-- Name: search_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_analytics (
    search_id bigint NOT NULL,
    user_id bigint,
    query character varying NOT NULL,
    results_count integer,
    clicked_entity_id bigint,
    search_date timestamp with time zone DEFAULT now(),
    filters json
);


--
-- Name: search_analytics_search_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.search_analytics_search_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: search_analytics_search_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.search_analytics_search_id_seq OWNED BY public.search_analytics.search_id;


--
-- Name: social_circle_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_circle_blocks (
    block_id integer NOT NULL,
    blocker_id integer,
    blocked_user_id integer,
    block_reason character varying(500),
    block_type character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_circle_blocks_block_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_circle_blocks_block_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_circle_blocks_block_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_circle_blocks_block_id_seq OWNED BY public.social_circle_blocks.block_id;


--
-- Name: social_circle_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_circle_members (
    circle_id integer NOT NULL,
    owner_id integer NOT NULL,
    member_id integer NOT NULL,
    membership_type character varying(50) NOT NULL,
    joined_at timestamp with time zone DEFAULT now(),
    can_see_private_reviews boolean,
    notification_preferences jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_circle_members_circle_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_circle_members_circle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_circle_members_circle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_circle_members_circle_id_seq OWNED BY public.social_circle_members.circle_id;


--
-- Name: social_circle_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_circle_requests (
    request_id integer NOT NULL,
    requester_id integer,
    recipient_id integer,
    request_message text,
    request_type character varying(20),
    status character varying(20),
    response_type character varying(20),
    response_message text,
    requested_at timestamp with time zone DEFAULT now(),
    responded_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: social_circle_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_circle_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_circle_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_circle_requests_request_id_seq OWNED BY public.social_circle_requests.request_id;


--
-- Name: unified_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unified_categories (
    id bigint NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    parent_id bigint,
    path character varying(500),
    level integer NOT NULL,
    icon character varying(50),
    color character varying(20),
    is_active boolean NOT NULL,
    sort_order integer NOT NULL,
    extra_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_level_consistency CHECK ((((parent_id IS NULL) AND (level = 1)) OR ((parent_id IS NOT NULL) AND (level > 1))))
);


--
-- Name: unified_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unified_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unified_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unified_categories_id_seq OWNED BY public.unified_categories.id;


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    user_id integer NOT NULL,
    badge_id integer NOT NULL,
    awarded_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_connections (
    user_id bigint NOT NULL,
    target_user_id bigint NOT NULL,
    connection_type public.connection_type_enum NOT NULL,
    status public.connection_status_enum,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_entity_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_entity_views (
    view_id integer NOT NULL,
    user_id integer,
    entity_id integer,
    viewed_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_entity_views_view_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_entity_views_view_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_entity_views_view_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_entity_views_view_id_seq OWNED BY public.user_entity_views.view_id;


--
-- Name: user_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_events (
    event_id bigint NOT NULL,
    user_id bigint,
    event_type character varying,
    event_data json,
    occurred_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_events_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_events_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_events_event_id_seq OWNED BY public.user_events.event_id;


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    user_id integer NOT NULL,
    bio character varying,
    first_name character varying(50),
    last_name character varying(50),
    avatar character varying,
    location character varying,
    website character varying,
    created_at timestamp without time zone
);


--
-- Name: user_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_progress (
    user_id bigint NOT NULL,
    points integer NOT NULL,
    level integer NOT NULL,
    progress_to_next_level integer NOT NULL,
    daily_streak integer NOT NULL,
    last_reviewed date,
    published_reviews integer NOT NULL,
    review_target integer NOT NULL,
    total_helpful_votes integer,
    average_rating_given numeric(3,2),
    entities_reviewed integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_search_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_search_history (
    search_id bigint NOT NULL,
    user_id bigint,
    query character varying NOT NULL,
    matched_entity_ids json,
    searched_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_search_history_search_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_search_history_search_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_search_history_search_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_search_history_search_id_seq OWNED BY public.user_search_history.search_id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    session_id bigint NOT NULL,
    user_id bigint NOT NULL,
    token_hash character varying(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    last_accessed timestamp with time zone DEFAULT now(),
    device_info json,
    is_valid boolean,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_sessions_session_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_sessions_session_id_seq OWNED BY public.user_sessions.session_id;


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    user_id bigint NOT NULL,
    privacy_settings json,
    notification_settings json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: v_group_reviews; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_group_reviews AS
 SELECT r.review_id,
    r.user_id,
    r.entity_id,
    r.role_id,
    r.title,
    r.content,
    r.overall_rating,
    r.is_anonymous,
    r.is_verified,
    r.view_count,
    r.reaction_count,
    r.comment_count,
    r.ratings,
    r.pros,
    r.cons,
    r.images,
    r.top_reactions,
    r.entity_summary,
    r.user_summary,
    r.reports_summary,
    r.created_at,
    r.updated_at,
    r.group_id,
    r.review_scope,
    g.name AS group_name,
    g.avatar_url AS group_avatar,
    u.username,
    u.first_name,
    u.last_name,
    u.avatar AS user_avatar,
    e.name AS entity_name
   FROM (((public.review_main r
     LEFT JOIN public.review_groups g ON ((r.group_id = g.group_id)))
     LEFT JOIN public.core_users u ON ((r.user_id = u.user_id)))
     LEFT JOIN public.core_entities e ON ((r.entity_id = e.entity_id)))
  WHERE (r.group_id IS NOT NULL)
  ORDER BY r.created_at DESC;


--
-- Name: view_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.view_analytics (
    analytics_id bigint NOT NULL,
    content_type character varying(20) NOT NULL,
    content_id integer NOT NULL,
    total_views integer,
    unique_users integer,
    unique_sessions integer,
    valid_views integer,
    views_today integer,
    views_this_week integer,
    views_this_month integer,
    last_updated timestamp with time zone DEFAULT now(),
    last_view_at timestamp with time zone
);


--
-- Name: view_analytics_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.view_analytics_analytics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: view_analytics_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.view_analytics_analytics_id_seq OWNED BY public.view_analytics.analytics_id;


--
-- Name: weekly_engagement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weekly_engagement (
    engagement_id bigint NOT NULL,
    user_id bigint,
    engagement_date date NOT NULL,
    reviews integer NOT NULL,
    reactions integer NOT NULL,
    comments integer NOT NULL,
    reports integer NOT NULL,
    forwards integer NOT NULL,
    points integer NOT NULL,
    streak_broken boolean,
    weekly_rank integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: weekly_engagement_engagement_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.weekly_engagement_engagement_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: weekly_engagement_engagement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.weekly_engagement_engagement_id_seq OWNED BY public.weekly_engagement.engagement_id;


--
-- Name: whats_next_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whats_next_goals (
    goal_id bigint NOT NULL,
    user_id bigint,
    description character varying(255) NOT NULL,
    target_type character varying(50) NOT NULL,
    target_value integer NOT NULL,
    reward character varying(100) NOT NULL,
    is_completed boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: whats_next_goals_goal_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.whats_next_goals_goal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: whats_next_goals_goal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.whats_next_goals_goal_id_seq OWNED BY public.whats_next_goals.goal_id;


--
-- Name: badge_awards award_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_awards ALTER COLUMN award_id SET DEFAULT nextval('public.badge_awards_award_id_seq'::regclass);


--
-- Name: badge_definitions badge_definition_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_definitions ALTER COLUMN badge_definition_id SET DEFAULT nextval('public.badge_definitions_badge_definition_id_seq'::regclass);


--
-- Name: badges badge_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges ALTER COLUMN badge_id SET DEFAULT nextval('public.badges_badge_id_seq'::regclass);


--
-- Name: category_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_questions ALTER COLUMN id SET DEFAULT nextval('public.category_questions_id_seq'::regclass);


--
-- Name: core_entities entity_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_entities ALTER COLUMN entity_id SET DEFAULT nextval('public.core_entities_entity_id_seq'::regclass);


--
-- Name: core_notifications notification_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.core_notifications_notification_id_seq'::regclass);


--
-- Name: core_users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_users ALTER COLUMN user_id SET DEFAULT nextval('public.core_users_user_id_seq'::regclass);


--
-- Name: daily_tasks task_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_tasks ALTER COLUMN task_id SET DEFAULT nextval('public.daily_tasks_task_id_seq'::regclass);


--
-- Name: entity_comparisons comparison_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_comparisons ALTER COLUMN comparison_id SET DEFAULT nextval('public.entity_comparisons_comparison_id_seq'::regclass);


--
-- Name: entity_metadata metadata_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_metadata ALTER COLUMN metadata_id SET DEFAULT nextval('public.entity_metadata_metadata_id_seq'::regclass);


--
-- Name: entity_roles role_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_roles ALTER COLUMN role_id SET DEFAULT nextval('public.entity_roles_role_id_seq'::regclass);


--
-- Name: entity_views view_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_views ALTER COLUMN view_id SET DEFAULT nextval('public.entity_views_view_id_seq'::regclass);


--
-- Name: group_categories category_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_categories ALTER COLUMN category_id SET DEFAULT nextval('public.group_categories_category_id_seq'::regclass);


--
-- Name: group_invitations invitation_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invitations ALTER COLUMN invitation_id SET DEFAULT nextval('public.group_invitations_invitation_id_seq'::regclass);


--
-- Name: group_memberships membership_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_memberships ALTER COLUMN membership_id SET DEFAULT nextval('public.group_memberships_membership_id_seq'::regclass);


--
-- Name: msg_conversation_participants participant_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_conversation_participants ALTER COLUMN participant_id SET DEFAULT nextval('public.msg_conversation_participants_participant_id_seq'::regclass);


--
-- Name: msg_conversations conversation_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_conversations ALTER COLUMN conversation_id SET DEFAULT nextval('public.msg_conversations_conversation_id_seq'::regclass);


--
-- Name: msg_message_attachments attachment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_attachments ALTER COLUMN attachment_id SET DEFAULT nextval('public.msg_message_attachments_attachment_id_seq'::regclass);


--
-- Name: msg_message_mentions mention_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_mentions ALTER COLUMN mention_id SET DEFAULT nextval('public.msg_message_mentions_mention_id_seq'::regclass);


--
-- Name: msg_message_pins pin_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_pins ALTER COLUMN pin_id SET DEFAULT nextval('public.msg_message_pins_pin_id_seq'::regclass);


--
-- Name: msg_message_reactions reaction_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_reactions ALTER COLUMN reaction_id SET DEFAULT nextval('public.msg_message_reactions_reaction_id_seq'::regclass);


--
-- Name: msg_message_status status_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_status ALTER COLUMN status_id SET DEFAULT nextval('public.msg_message_status_status_id_seq'::regclass);


--
-- Name: msg_messages message_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_messages ALTER COLUMN message_id SET DEFAULT nextval('public.msg_messages_message_id_seq'::regclass);


--
-- Name: msg_threads thread_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_threads ALTER COLUMN thread_id SET DEFAULT nextval('public.msg_threads_thread_id_seq'::regclass);


--
-- Name: msg_typing_indicators typing_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_typing_indicators ALTER COLUMN typing_id SET DEFAULT nextval('public.msg_typing_indicators_typing_id_seq'::regclass);


--
-- Name: msg_user_presence presence_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_user_presence ALTER COLUMN presence_id SET DEFAULT nextval('public.msg_user_presence_presence_id_seq'::regclass);


--
-- Name: review_comment_reactions reaction_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_comment_reactions ALTER COLUMN reaction_id SET DEFAULT nextval('public.review_comment_reactions_reaction_id_seq'::regclass);


--
-- Name: review_comments comment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_comments ALTER COLUMN comment_id SET DEFAULT nextval('public.review_comments_comment_id_seq'::regclass);


--
-- Name: review_groups group_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_groups ALTER COLUMN group_id SET DEFAULT nextval('public.review_groups_group_id_seq'::regclass);


--
-- Name: review_main review_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_main ALTER COLUMN review_id SET DEFAULT nextval('public.review_main_review_id_seq'::regclass);


--
-- Name: review_reactions reaction_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reactions ALTER COLUMN reaction_id SET DEFAULT nextval('public.review_reactions_reaction_id_seq'::regclass);


--
-- Name: review_templates template_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_templates ALTER COLUMN template_id SET DEFAULT nextval('public.review_templates_template_id_seq'::regclass);


--
-- Name: review_versions version_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_versions ALTER COLUMN version_id SET DEFAULT nextval('public.review_versions_version_id_seq'::regclass);


--
-- Name: review_views view_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_views ALTER COLUMN view_id SET DEFAULT nextval('public.review_views_view_id_seq'::regclass);


--
-- Name: search_analytics search_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_analytics ALTER COLUMN search_id SET DEFAULT nextval('public.search_analytics_search_id_seq'::regclass);


--
-- Name: social_circle_blocks block_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_circle_blocks ALTER COLUMN block_id SET DEFAULT nextval('public.social_circle_blocks_block_id_seq'::regclass);


--
-- Name: social_circle_members circle_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_circle_members ALTER COLUMN circle_id SET DEFAULT nextval('public.social_circle_members_circle_id_seq'::regclass);


--
-- Name: social_circle_requests request_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_circle_requests ALTER COLUMN request_id SET DEFAULT nextval('public.social_circle_requests_request_id_seq'::regclass);


--
-- Name: unified_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_categories ALTER COLUMN id SET DEFAULT nextval('public.unified_categories_id_seq'::regclass);


--
-- Name: user_entity_views view_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entity_views ALTER COLUMN view_id SET DEFAULT nextval('public.user_entity_views_view_id_seq'::regclass);


--
-- Name: user_events event_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_events ALTER COLUMN event_id SET DEFAULT nextval('public.user_events_event_id_seq'::regclass);


--
-- Name: user_search_history search_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_search_history ALTER COLUMN search_id SET DEFAULT nextval('public.user_search_history_search_id_seq'::regclass);


--
-- Name: user_sessions session_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.user_sessions_session_id_seq'::regclass);


--
-- Name: view_analytics analytics_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.view_analytics ALTER COLUMN analytics_id SET DEFAULT nextval('public.view_analytics_analytics_id_seq'::regclass);


--
-- Name: weekly_engagement engagement_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_engagement ALTER COLUMN engagement_id SET DEFAULT nextval('public.weekly_engagement_engagement_id_seq'::regclass);


--
-- Name: whats_next_goals goal_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whats_next_goals ALTER COLUMN goal_id SET DEFAULT nextval('public.whats_next_goals_goal_id_seq'::regclass);


--
-- Name: badge_awards badge_awards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_awards
    ADD CONSTRAINT badge_awards_pkey PRIMARY KEY (award_id);


--
-- Name: badge_definitions badge_definitions_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_definitions
    ADD CONSTRAINT badge_definitions_name_key UNIQUE (name);


--
-- Name: badge_definitions badge_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_definitions
    ADD CONSTRAINT badge_definitions_pkey PRIMARY KEY (badge_definition_id);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (badge_id);


--
-- Name: category_questions category_questions_category_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_questions
    ADD CONSTRAINT category_questions_category_path_key UNIQUE (category_path);


--
-- Name: category_questions category_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_questions
    ADD CONSTRAINT category_questions_pkey PRIMARY KEY (id);


--
-- Name: core_entities core_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_entities
    ADD CONSTRAINT core_entities_pkey PRIMARY KEY (entity_id);


--
-- Name: core_notifications core_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_notifications
    ADD CONSTRAINT core_notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: core_users core_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_users
    ADD CONSTRAINT core_users_email_key UNIQUE (email);


--
-- Name: core_users core_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_users
    ADD CONSTRAINT core_users_pkey PRIMARY KEY (user_id);


--
-- Name: core_users core_users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_users
    ADD CONSTRAINT core_users_username_key UNIQUE (username);


--
-- Name: daily_tasks daily_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_tasks
    ADD CONSTRAINT daily_tasks_pkey PRIMARY KEY (task_id);


--
-- Name: entity_analytics entity_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_analytics
    ADD CONSTRAINT entity_analytics_pkey PRIMARY KEY (entity_id);


--
-- Name: entity_comparisons entity_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_comparisons
    ADD CONSTRAINT entity_comparisons_pkey PRIMARY KEY (comparison_id);


--
-- Name: entity_metadata entity_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_metadata
    ADD CONSTRAINT entity_metadata_pkey PRIMARY KEY (metadata_id);


--
-- Name: entity_relations entity_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_relations
    ADD CONSTRAINT entity_relations_pkey PRIMARY KEY (entity_id, related_entity_id);


--
-- Name: entity_roles entity_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_roles
    ADD CONSTRAINT entity_roles_pkey PRIMARY KEY (role_id);


--
-- Name: entity_views entity_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_views
    ADD CONSTRAINT entity_views_pkey PRIMARY KEY (view_id);


--
-- Name: followers followers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_pkey PRIMARY KEY (user_id, follower_user_id);


--
-- Name: group_categories group_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_categories
    ADD CONSTRAINT group_categories_pkey PRIMARY KEY (category_id);


--
-- Name: group_category_mappings group_category_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_category_mappings
    ADD CONSTRAINT group_category_mappings_pkey PRIMARY KEY (group_id, category_id);


--
-- Name: group_invitations group_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invitations
    ADD CONSTRAINT group_invitations_pkey PRIMARY KEY (invitation_id);


--
-- Name: group_memberships group_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_memberships
    ADD CONSTRAINT group_memberships_pkey PRIMARY KEY (membership_id);


--
-- Name: msg_conversation_participants msg_conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_conversation_participants
    ADD CONSTRAINT msg_conversation_participants_pkey PRIMARY KEY (participant_id);


--
-- Name: msg_conversations msg_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_conversations
    ADD CONSTRAINT msg_conversations_pkey PRIMARY KEY (conversation_id);


--
-- Name: msg_message_attachments msg_message_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_attachments
    ADD CONSTRAINT msg_message_attachments_pkey PRIMARY KEY (attachment_id);


--
-- Name: msg_message_mentions msg_message_mentions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_mentions
    ADD CONSTRAINT msg_message_mentions_pkey PRIMARY KEY (mention_id);


--
-- Name: msg_message_pins msg_message_pins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_pins
    ADD CONSTRAINT msg_message_pins_pkey PRIMARY KEY (pin_id);


--
-- Name: msg_message_reactions msg_message_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_reactions
    ADD CONSTRAINT msg_message_reactions_pkey PRIMARY KEY (reaction_id);


--
-- Name: msg_message_status msg_message_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_status
    ADD CONSTRAINT msg_message_status_pkey PRIMARY KEY (status_id);


--
-- Name: msg_messages msg_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_messages
    ADD CONSTRAINT msg_messages_pkey PRIMARY KEY (message_id);


--
-- Name: msg_threads msg_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_threads
    ADD CONSTRAINT msg_threads_pkey PRIMARY KEY (thread_id);


--
-- Name: msg_typing_indicators msg_typing_indicators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_typing_indicators
    ADD CONSTRAINT msg_typing_indicators_pkey PRIMARY KEY (typing_id);


--
-- Name: msg_user_presence msg_user_presence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_user_presence
    ADD CONSTRAINT msg_user_presence_pkey PRIMARY KEY (presence_id);


--
-- Name: msg_user_presence msg_user_presence_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_user_presence
    ADD CONSTRAINT msg_user_presence_user_id_key UNIQUE (user_id);


--
-- Name: review_comment_reactions review_comment_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_comment_reactions
    ADD CONSTRAINT review_comment_reactions_pkey PRIMARY KEY (reaction_id);


--
-- Name: review_comments review_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_pkey PRIMARY KEY (comment_id);


--
-- Name: review_groups review_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_groups
    ADD CONSTRAINT review_groups_pkey PRIMARY KEY (group_id);


--
-- Name: review_main review_main_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_main
    ADD CONSTRAINT review_main_pkey PRIMARY KEY (review_id);


--
-- Name: review_reactions review_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reactions
    ADD CONSTRAINT review_reactions_pkey PRIMARY KEY (reaction_id);


--
-- Name: review_templates review_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_templates
    ADD CONSTRAINT review_templates_pkey PRIMARY KEY (template_id);


--
-- Name: review_versions review_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_versions
    ADD CONSTRAINT review_versions_pkey PRIMARY KEY (version_id);


--
-- Name: review_views review_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_views
    ADD CONSTRAINT review_views_pkey PRIMARY KEY (view_id);


--
-- Name: search_analytics search_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_analytics
    ADD CONSTRAINT search_analytics_pkey PRIMARY KEY (search_id);


--
-- Name: social_circle_blocks social_circle_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_circle_blocks
    ADD CONSTRAINT social_circle_blocks_pkey PRIMARY KEY (block_id);


--
-- Name: social_circle_members social_circle_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_circle_members
    ADD CONSTRAINT social_circle_members_pkey PRIMARY KEY (circle_id);


--
-- Name: social_circle_requests social_circle_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_circle_requests
    ADD CONSTRAINT social_circle_requests_pkey PRIMARY KEY (request_id);


--
-- Name: unified_categories unified_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_categories
    ADD CONSTRAINT unified_categories_pkey PRIMARY KEY (id);


--
-- Name: group_memberships unique_group_user_membership; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_memberships
    ADD CONSTRAINT unique_group_user_membership UNIQUE (group_id, user_id);


--
-- Name: social_circle_members unique_member_owner_connection; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_circle_members
    ADD CONSTRAINT unique_member_owner_connection UNIQUE (member_id, owner_id);


--
-- Name: group_invitations unique_pending_invitation; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invitations
    ADD CONSTRAINT unique_pending_invitation UNIQUE (group_id, invitee_id, status);


--
-- Name: social_circle_requests unique_pending_request; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_circle_requests
    ADD CONSTRAINT unique_pending_request UNIQUE (requester_id, recipient_id, status);


--
-- Name: review_reactions uq_review_reactions_user_review; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reactions
    ADD CONSTRAINT uq_review_reactions_user_review UNIQUE (user_id, review_id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (user_id, badge_id);


--
-- Name: user_connections user_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_pkey PRIMARY KEY (user_id, target_user_id);


--
-- Name: user_entity_views user_entity_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entity_views
    ADD CONSTRAINT user_entity_views_pkey PRIMARY KEY (view_id);


--
-- Name: user_events user_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_events
    ADD CONSTRAINT user_events_pkey PRIMARY KEY (event_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: user_progress user_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_pkey PRIMARY KEY (user_id);


--
-- Name: user_search_history user_search_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_search_history
    ADD CONSTRAINT user_search_history_pkey PRIMARY KEY (search_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: user_sessions user_sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_token_hash_key UNIQUE (token_hash);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (user_id);


--
-- Name: view_analytics view_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.view_analytics
    ADD CONSTRAINT view_analytics_pkey PRIMARY KEY (analytics_id);


--
-- Name: weekly_engagement weekly_engagement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_engagement
    ADD CONSTRAINT weekly_engagement_pkey PRIMARY KEY (engagement_id);


--
-- Name: whats_next_goals whats_next_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whats_next_goals
    ADD CONSTRAINT whats_next_goals_pkey PRIMARY KEY (goal_id);


--
-- Name: idx_entity_views_entity_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entity_views_entity_ip ON public.entity_views USING btree (entity_id, ip_address);


--
-- Name: idx_entity_views_entity_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entity_views_entity_user ON public.entity_views USING btree (entity_id, user_id);


--
-- Name: idx_entity_views_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entity_views_expires_at ON public.entity_views USING btree (expires_at);


--
-- Name: idx_group_invitations_invitee_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_invitations_invitee_status ON public.group_invitations USING btree (invitee_id, status);


--
-- Name: idx_group_memberships_group_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_memberships_group_user ON public.group_memberships USING btree (group_id, user_id);


--
-- Name: idx_mention_acknowledged; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mention_acknowledged ON public.msg_message_mentions USING btree (mentioned_user_id, is_acknowledged);


--
-- Name: idx_mention_message; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mention_message ON public.msg_message_mentions USING btree (message_id);


--
-- Name: idx_mention_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mention_user ON public.msg_message_mentions USING btree (mentioned_user_id);


--
-- Name: idx_message_status_message_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_status_message_user ON public.msg_message_status USING btree (message_id, user_id);


--
-- Name: idx_message_status_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_status_user_status ON public.msg_message_status USING btree (user_id, status);


--
-- Name: idx_pin_conversation_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pin_conversation_active ON public.msg_message_pins USING btree (conversation_id, is_active);


--
-- Name: idx_pin_message; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pin_message ON public.msg_message_pins USING btree (message_id);


--
-- Name: idx_presence_last_seen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presence_last_seen ON public.msg_user_presence USING btree (last_seen);


--
-- Name: idx_presence_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presence_user_status ON public.msg_user_presence USING btree (user_id, status);


--
-- Name: idx_review_comment_reactions_comment_id_for_count; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_comment_reactions_comment_id_for_count ON public.review_comment_reactions USING btree (comment_id) WHERE (comment_id IS NOT NULL);


--
-- Name: idx_review_comments_review_id_for_count; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_comments_review_id_for_count ON public.review_comments USING btree (review_id) WHERE (review_id IS NOT NULL);


--
-- Name: idx_review_main_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_main_group_id ON public.review_main USING btree (group_id);


--
-- Name: idx_review_reactions_review_analytics; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_reactions_review_analytics ON public.review_reactions USING btree (review_id, reaction_type, created_at);


--
-- Name: idx_review_reactions_review_id_type_for_count; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_reactions_review_id_type_for_count ON public.review_reactions USING btree (review_id, reaction_type) WHERE (review_id IS NOT NULL);


--
-- Name: idx_review_reactions_type_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_reactions_type_created ON public.review_reactions USING btree (reaction_type, created_at DESC);


--
-- Name: idx_review_reactions_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_reactions_user_created ON public.review_reactions USING btree (user_id, created_at DESC);


--
-- Name: idx_review_reactions_user_review_optimized; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_reactions_user_review_optimized ON public.review_reactions USING btree (user_id, review_id);


--
-- Name: idx_review_views_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_views_expires_at ON public.review_views USING btree (expires_at);


--
-- Name: idx_review_views_review_id_valid_simple; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_views_review_id_valid_simple ON public.review_views USING btree (review_id, is_valid, expires_at);


--
-- Name: idx_review_views_review_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_views_review_ip ON public.review_views USING btree (review_id, ip_address);


--
-- Name: idx_review_views_review_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_views_review_user ON public.review_views USING btree (review_id, user_id);


--
-- Name: idx_review_views_viewed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_views_viewed_at ON public.review_views USING btree (viewed_at);


--
-- Name: idx_social_circle_blocks_blocked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_circle_blocks_blocked ON public.social_circle_blocks USING btree (blocked_user_id);


--
-- Name: idx_social_circle_blocks_blocker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_circle_blocks_blocker ON public.social_circle_blocks USING btree (blocker_id);


--
-- Name: idx_social_circle_members_member_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_circle_members_member_id ON public.social_circle_members USING btree (member_id);


--
-- Name: idx_social_circle_members_membership_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_circle_members_membership_type ON public.social_circle_members USING btree (membership_type);


--
-- Name: idx_social_circle_members_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_circle_members_owner_id ON public.social_circle_members USING btree (owner_id);


--
-- Name: idx_social_circle_requests_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_circle_requests_created_at ON public.social_circle_requests USING btree (created_at);


--
-- Name: idx_social_circle_requests_recipient_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_circle_requests_recipient_status ON public.social_circle_requests USING btree (recipient_id, status);


--
-- Name: idx_social_circle_requests_requester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_circle_requests_requester ON public.social_circle_requests USING btree (requester_id);


--
-- Name: idx_thread_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_conversation ON public.msg_threads USING btree (conversation_id);


--
-- Name: idx_thread_last_reply; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_last_reply ON public.msg_threads USING btree (last_reply_at);


--
-- Name: idx_thread_parent_message; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_parent_message ON public.msg_threads USING btree (parent_message_id);


--
-- Name: idx_typing_conversation_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_typing_conversation_user ON public.msg_typing_indicators USING btree (conversation_id, user_id);


--
-- Name: idx_typing_last_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_typing_last_activity ON public.msg_typing_indicators USING btree (last_activity);


--
-- Name: idx_view_analytics_content; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_view_analytics_content ON public.view_analytics USING btree (content_type, content_id);


--
-- Name: idx_view_analytics_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_view_analytics_updated ON public.view_analytics USING btree (last_updated);


--
-- Name: ix_badge_awards_award_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_badge_awards_award_id ON public.badge_awards USING btree (award_id);


--
-- Name: ix_badge_definitions_badge_definition_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_badge_definitions_badge_definition_id ON public.badge_definitions USING btree (badge_definition_id);


--
-- Name: ix_badges_badge_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_badges_badge_id ON public.badges USING btree (badge_id);


--
-- Name: ix_category_questions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_category_questions_id ON public.category_questions USING btree (id);


--
-- Name: ix_core_entities_entity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_core_entities_entity_id ON public.core_entities USING btree (entity_id);


--
-- Name: ix_core_entities_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_core_entities_name ON public.core_entities USING btree (name);


--
-- Name: ix_core_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_core_notifications_created_at ON public.core_notifications USING btree (created_at);


--
-- Name: ix_core_notifications_delivery_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_core_notifications_delivery_status ON public.core_notifications USING btree (delivery_status);


--
-- Name: ix_core_notifications_entity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_core_notifications_entity_id ON public.core_notifications USING btree (entity_id);


--
-- Name: ix_core_notifications_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_core_notifications_entity_type ON public.core_notifications USING btree (entity_type);


--
-- Name: ix_core_notifications_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_core_notifications_expires_at ON public.core_notifications USING btree (expires_at);


--
-- Name: ix_core_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_core_notifications_is_read ON public.core_notifications USING btree (is_read);


--
-- Name: ix_core_notifications_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_core_notifications_priority ON public.core_notifications USING btree (priority);


--
-- Name: ix_core_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_core_notifications_type ON public.core_notifications USING btree (type);


--
-- Name: ix_core_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_core_notifications_user_id ON public.core_notifications USING btree (user_id);


--
-- Name: ix_core_users_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_core_users_user_id ON public.core_users USING btree (user_id);


--
-- Name: ix_daily_tasks_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_daily_tasks_task_id ON public.daily_tasks USING btree (task_id);


--
-- Name: ix_entity_comparisons_comparison_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_entity_comparisons_comparison_id ON public.entity_comparisons USING btree (comparison_id);


--
-- Name: ix_entity_metadata_metadata_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_entity_metadata_metadata_id ON public.entity_metadata USING btree (metadata_id);


--
-- Name: ix_entity_roles_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_entity_roles_role_id ON public.entity_roles USING btree (role_id);


--
-- Name: ix_entity_views_view_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_entity_views_view_id ON public.entity_views USING btree (view_id);


--
-- Name: ix_group_categories_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_group_categories_category_id ON public.group_categories USING btree (category_id);


--
-- Name: ix_group_invitations_invitation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_group_invitations_invitation_id ON public.group_invitations USING btree (invitation_id);


--
-- Name: ix_group_memberships_membership_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_group_memberships_membership_id ON public.group_memberships USING btree (membership_id);


--
-- Name: ix_msg_conversation_participants_participant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_msg_conversation_participants_participant_id ON public.msg_conversation_participants USING btree (participant_id);


--
-- Name: ix_msg_conversations_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_msg_conversations_conversation_id ON public.msg_conversations USING btree (conversation_id);


--
-- Name: ix_msg_message_attachments_attachment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_msg_message_attachments_attachment_id ON public.msg_message_attachments USING btree (attachment_id);


--
-- Name: ix_msg_message_mentions_mention_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_msg_message_mentions_mention_id ON public.msg_message_mentions USING btree (mention_id);


--
-- Name: ix_msg_message_pins_pin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_msg_message_pins_pin_id ON public.msg_message_pins USING btree (pin_id);


--
-- Name: ix_msg_message_reactions_reaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_msg_message_reactions_reaction_id ON public.msg_message_reactions USING btree (reaction_id);


--
-- Name: ix_msg_message_status_status_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_msg_message_status_status_id ON public.msg_message_status USING btree (status_id);


--
-- Name: ix_msg_messages_message_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_msg_messages_message_id ON public.msg_messages USING btree (message_id);


--
-- Name: ix_msg_threads_thread_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_msg_threads_thread_id ON public.msg_threads USING btree (thread_id);


--
-- Name: ix_msg_typing_indicators_typing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_msg_typing_indicators_typing_id ON public.msg_typing_indicators USING btree (typing_id);


--
-- Name: ix_msg_user_presence_presence_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_msg_user_presence_presence_id ON public.msg_user_presence USING btree (presence_id);


--
-- Name: ix_review_comment_reactions_reaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_review_comment_reactions_reaction_id ON public.review_comment_reactions USING btree (reaction_id);


--
-- Name: ix_review_comments_comment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_review_comments_comment_id ON public.review_comments USING btree (comment_id);


--
-- Name: ix_review_groups_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_review_groups_group_id ON public.review_groups USING btree (group_id);


--
-- Name: ix_review_groups_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_review_groups_name ON public.review_groups USING btree (name);


--
-- Name: ix_review_main_review_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_review_main_review_id ON public.review_main USING btree (review_id);


--
-- Name: ix_review_reactions_reaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_review_reactions_reaction_id ON public.review_reactions USING btree (reaction_id);


--
-- Name: ix_review_templates_template_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_review_templates_template_id ON public.review_templates USING btree (template_id);


--
-- Name: ix_review_versions_version_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_review_versions_version_id ON public.review_versions USING btree (version_id);


--
-- Name: ix_review_views_view_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_review_views_view_id ON public.review_views USING btree (view_id);


--
-- Name: ix_search_analytics_search_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_search_analytics_search_id ON public.search_analytics USING btree (search_id);


--
-- Name: ix_social_circle_blocks_block_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_social_circle_blocks_block_id ON public.social_circle_blocks USING btree (block_id);


--
-- Name: ix_social_circle_members_circle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_social_circle_members_circle_id ON public.social_circle_members USING btree (circle_id);


--
-- Name: ix_social_circle_requests_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_social_circle_requests_request_id ON public.social_circle_requests USING btree (request_id);


--
-- Name: ix_unified_categories_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_unified_categories_id ON public.unified_categories USING btree (id);


--
-- Name: ix_unified_categories_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_unified_categories_path ON public.unified_categories USING btree (path);


--
-- Name: ix_user_entity_views_view_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_entity_views_view_id ON public.user_entity_views USING btree (view_id);


--
-- Name: ix_user_events_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_events_event_id ON public.user_events USING btree (event_id);


--
-- Name: ix_user_search_history_search_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_search_history_search_id ON public.user_search_history USING btree (search_id);


--
-- Name: ix_user_sessions_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_sessions_session_id ON public.user_sessions USING btree (session_id);


--
-- Name: ix_view_analytics_analytics_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_view_analytics_analytics_id ON public.view_analytics USING btree (analytics_id);


--
-- Name: ix_weekly_engagement_engagement_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_weekly_engagement_engagement_id ON public.weekly_engagement USING btree (engagement_id);


--
-- Name: ix_whats_next_goals_goal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_whats_next_goals_goal_id ON public.whats_next_goals USING btree (goal_id);


--
-- Name: core_users tr_core_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_core_users_updated_at BEFORE UPDATE ON public.core_users FOR EACH ROW EXECUTE FUNCTION public.update_core_users_updated_at();


--
-- Name: review_main trg_update_group_review_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_group_review_count AFTER INSERT OR DELETE OR UPDATE ON public.review_main FOR EACH ROW EXECUTE FUNCTION public.update_group_review_count();


--
-- Name: review_comment_reactions trigger_update_comment_reaction_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_comment_reaction_count AFTER INSERT OR DELETE OR UPDATE OF comment_id ON public.review_comment_reactions FOR EACH ROW EXECUTE FUNCTION public.update_comment_reaction_count();


--
-- Name: review_comments trigger_update_review_comment_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_review_comment_count AFTER INSERT OR DELETE OR UPDATE OF review_id ON public.review_comments FOR EACH ROW EXECUTE FUNCTION public.update_review_comment_count();


--
-- Name: review_reactions trigger_update_review_reaction_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_review_reaction_count AFTER INSERT OR DELETE OR UPDATE OF review_id ON public.review_reactions FOR EACH ROW EXECUTE FUNCTION public.update_review_reaction_count();


--
-- Name: review_views trigger_update_review_view_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_review_view_count AFTER INSERT OR DELETE OR UPDATE OF review_id ON public.review_views FOR EACH ROW EXECUTE FUNCTION public.update_review_view_count();


--
-- Name: badge_awards badge_awards_badge_definition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_awards
    ADD CONSTRAINT badge_awards_badge_definition_id_fkey FOREIGN KEY (badge_definition_id) REFERENCES public.badge_definitions(badge_definition_id) ON DELETE RESTRICT;


--
-- Name: badge_awards badge_awards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_awards
    ADD CONSTRAINT badge_awards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: category_questions category_questions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_questions
    ADD CONSTRAINT category_questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.core_users(user_id);


--
-- Name: core_entities core_entities_claimed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_entities
    ADD CONSTRAINT core_entities_claimed_by_fkey FOREIGN KEY (claimed_by) REFERENCES public.core_users(user_id);


--
-- Name: core_notifications core_notifications_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_notifications
    ADD CONSTRAINT core_notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.core_users(user_id) ON DELETE SET NULL;


--
-- Name: core_notifications core_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.core_notifications
    ADD CONSTRAINT core_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: daily_tasks daily_tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_tasks
    ADD CONSTRAINT daily_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: entity_analytics entity_analytics_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_analytics
    ADD CONSTRAINT entity_analytics_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(entity_id) ON DELETE CASCADE;


--
-- Name: entity_comparisons entity_comparisons_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_comparisons
    ADD CONSTRAINT entity_comparisons_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE SET NULL;


--
-- Name: entity_metadata entity_metadata_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_metadata
    ADD CONSTRAINT entity_metadata_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(entity_id) ON DELETE CASCADE;


--
-- Name: entity_relations entity_relations_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_relations
    ADD CONSTRAINT entity_relations_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(entity_id);


--
-- Name: entity_relations entity_relations_related_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_relations
    ADD CONSTRAINT entity_relations_related_entity_id_fkey FOREIGN KEY (related_entity_id) REFERENCES public.core_entities(entity_id);


--
-- Name: entity_roles entity_roles_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_roles
    ADD CONSTRAINT entity_roles_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(entity_id) ON DELETE CASCADE;


--
-- Name: entity_views entity_views_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_views
    ADD CONSTRAINT entity_views_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(entity_id);


--
-- Name: entity_views entity_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_views
    ADD CONSTRAINT entity_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- Name: followers followers_follower_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_follower_user_id_fkey FOREIGN KEY (follower_user_id) REFERENCES public.core_users(user_id);


--
-- Name: followers followers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- Name: group_categories group_categories_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_categories
    ADD CONSTRAINT group_categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.group_categories(category_id);


--
-- Name: group_category_mappings group_category_mappings_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_category_mappings
    ADD CONSTRAINT group_category_mappings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.group_categories(category_id) ON DELETE CASCADE;


--
-- Name: group_category_mappings group_category_mappings_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_category_mappings
    ADD CONSTRAINT group_category_mappings_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.review_groups(group_id) ON DELETE CASCADE;


--
-- Name: group_invitations group_invitations_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invitations
    ADD CONSTRAINT group_invitations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.review_groups(group_id) ON DELETE CASCADE;


--
-- Name: group_invitations group_invitations_invitee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invitations
    ADD CONSTRAINT group_invitations_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: group_invitations group_invitations_inviter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invitations
    ADD CONSTRAINT group_invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: group_memberships group_memberships_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_memberships
    ADD CONSTRAINT group_memberships_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.review_groups(group_id) ON DELETE CASCADE;


--
-- Name: group_memberships group_memberships_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_memberships
    ADD CONSTRAINT group_memberships_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.core_users(user_id);


--
-- Name: group_memberships group_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_memberships
    ADD CONSTRAINT group_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: msg_conversation_participants msg_conversation_participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_conversation_participants
    ADD CONSTRAINT msg_conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.msg_conversations(conversation_id) ON DELETE CASCADE;


--
-- Name: msg_conversation_participants msg_conversation_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_conversation_participants
    ADD CONSTRAINT msg_conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: msg_message_attachments msg_message_attachments_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_attachments
    ADD CONSTRAINT msg_message_attachments_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.msg_messages(message_id) ON DELETE CASCADE;


--
-- Name: msg_message_mentions msg_message_mentions_mentioned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_mentions
    ADD CONSTRAINT msg_message_mentions_mentioned_user_id_fkey FOREIGN KEY (mentioned_user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: msg_message_mentions msg_message_mentions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_mentions
    ADD CONSTRAINT msg_message_mentions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.msg_messages(message_id) ON DELETE CASCADE;


--
-- Name: msg_message_pins msg_message_pins_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_pins
    ADD CONSTRAINT msg_message_pins_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.msg_conversations(conversation_id) ON DELETE CASCADE;


--
-- Name: msg_message_pins msg_message_pins_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_pins
    ADD CONSTRAINT msg_message_pins_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.msg_messages(message_id) ON DELETE CASCADE;


--
-- Name: msg_message_pins msg_message_pins_pinned_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_pins
    ADD CONSTRAINT msg_message_pins_pinned_by_user_id_fkey FOREIGN KEY (pinned_by_user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: msg_message_reactions msg_message_reactions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_reactions
    ADD CONSTRAINT msg_message_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.msg_messages(message_id) ON DELETE CASCADE;


--
-- Name: msg_message_reactions msg_message_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_reactions
    ADD CONSTRAINT msg_message_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: msg_message_status msg_message_status_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_status
    ADD CONSTRAINT msg_message_status_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.msg_messages(message_id) ON DELETE CASCADE;


--
-- Name: msg_message_status msg_message_status_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_message_status
    ADD CONSTRAINT msg_message_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: msg_messages msg_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_messages
    ADD CONSTRAINT msg_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.msg_conversations(conversation_id) ON DELETE CASCADE;


--
-- Name: msg_messages msg_messages_reply_to_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_messages
    ADD CONSTRAINT msg_messages_reply_to_message_id_fkey FOREIGN KEY (reply_to_message_id) REFERENCES public.msg_messages(message_id);


--
-- Name: msg_messages msg_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_messages
    ADD CONSTRAINT msg_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: msg_threads msg_threads_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_threads
    ADD CONSTRAINT msg_threads_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.msg_conversations(conversation_id) ON DELETE CASCADE;


--
-- Name: msg_threads msg_threads_last_reply_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_threads
    ADD CONSTRAINT msg_threads_last_reply_user_id_fkey FOREIGN KEY (last_reply_user_id) REFERENCES public.core_users(user_id);


--
-- Name: msg_threads msg_threads_parent_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_threads
    ADD CONSTRAINT msg_threads_parent_message_id_fkey FOREIGN KEY (parent_message_id) REFERENCES public.msg_messages(message_id) ON DELETE CASCADE;


--
-- Name: msg_typing_indicators msg_typing_indicators_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_typing_indicators
    ADD CONSTRAINT msg_typing_indicators_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.msg_conversations(conversation_id) ON DELETE CASCADE;


--
-- Name: msg_typing_indicators msg_typing_indicators_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_typing_indicators
    ADD CONSTRAINT msg_typing_indicators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: msg_user_presence msg_user_presence_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.msg_user_presence
    ADD CONSTRAINT msg_user_presence_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: review_comment_reactions review_comment_reactions_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_comment_reactions
    ADD CONSTRAINT review_comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.review_comments(comment_id) ON DELETE CASCADE;


--
-- Name: review_comment_reactions review_comment_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_comment_reactions
    ADD CONSTRAINT review_comment_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- Name: review_comments review_comments_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.review_main(review_id);


--
-- Name: review_comments review_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- Name: review_groups review_groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_groups
    ADD CONSTRAINT review_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.core_users(user_id);


--
-- Name: review_main review_main_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_main
    ADD CONSTRAINT review_main_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(entity_id) ON DELETE CASCADE;


--
-- Name: review_main review_main_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_main
    ADD CONSTRAINT review_main_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.review_groups(group_id) ON DELETE SET NULL;


--
-- Name: review_main review_main_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_main
    ADD CONSTRAINT review_main_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: review_reactions review_reactions_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reactions
    ADD CONSTRAINT review_reactions_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.review_main(review_id);


--
-- Name: review_reactions review_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reactions
    ADD CONSTRAINT review_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- Name: review_templates review_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_templates
    ADD CONSTRAINT review_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.core_users(user_id) ON DELETE SET NULL;


--
-- Name: review_templates review_templates_unified_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_templates
    ADD CONSTRAINT review_templates_unified_category_id_fkey FOREIGN KEY (unified_category_id) REFERENCES public.unified_categories(id);


--
-- Name: review_versions review_versions_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_versions
    ADD CONSTRAINT review_versions_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.review_main(review_id) ON DELETE CASCADE;


--
-- Name: review_versions review_versions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_versions
    ADD CONSTRAINT review_versions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- Name: review_views review_views_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_views
    ADD CONSTRAINT review_views_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.review_main(review_id);


--
-- Name: review_views review_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_views
    ADD CONSTRAINT review_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- Name: search_analytics search_analytics_clicked_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_analytics
    ADD CONSTRAINT search_analytics_clicked_entity_id_fkey FOREIGN KEY (clicked_entity_id) REFERENCES public.core_entities(entity_id) ON DELETE SET NULL;


--
-- Name: search_analytics search_analytics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_analytics
    ADD CONSTRAINT search_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE SET NULL;


--
-- Name: social_circle_blocks social_circle_blocks_blocked_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_circle_blocks
    ADD CONSTRAINT social_circle_blocks_blocked_user_id_fkey FOREIGN KEY (blocked_user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: social_circle_blocks social_circle_blocks_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_circle_blocks
    ADD CONSTRAINT social_circle_blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: social_circle_members social_circle_members_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_circle_members
    ADD CONSTRAINT social_circle_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: social_circle_members social_circle_members_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_circle_members
    ADD CONSTRAINT social_circle_members_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: social_circle_requests social_circle_requests_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_circle_requests
    ADD CONSTRAINT social_circle_requests_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: social_circle_requests social_circle_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_circle_requests
    ADD CONSTRAINT social_circle_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: unified_categories unified_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_categories
    ADD CONSTRAINT unified_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.unified_categories(id) ON DELETE CASCADE;


--
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(badge_id);


--
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- Name: user_connections user_connections_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: user_connections user_connections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: user_entity_views user_entity_views_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entity_views
    ADD CONSTRAINT user_entity_views_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(entity_id);


--
-- Name: user_entity_views user_entity_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entity_views
    ADD CONSTRAINT user_entity_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- Name: user_events user_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_events
    ADD CONSTRAINT user_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- Name: user_progress user_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: user_search_history user_search_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_search_history
    ADD CONSTRAINT user_search_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: weekly_engagement weekly_engagement_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_engagement
    ADD CONSTRAINT weekly_engagement_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- Name: whats_next_goals whats_next_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whats_next_goals
    ADD CONSTRAINT whats_next_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict YhSKJHPVPkfbBloszfBylJCgfoDZW9x0ucNTjwGQJDrHTbihvZ6KGKhGxU2J65A

